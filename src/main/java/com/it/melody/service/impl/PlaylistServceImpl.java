package com.it.melody.service.impl;

import com.it.melody.mapper.PlaylistMapper;
import com.it.melody.mapper.UserMapper;
import com.it.melody.pojo.Playlist;
import com.it.melody.service.PlaylistServce;
import com.it.melody.service.SongService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlaylistServceImpl implements PlaylistServce {

    @Autowired
    PlaylistMapper playlistMapper;
    @Autowired
    SongService songService;
    @Autowired
    private UserMapper userMapper;

    @Override
    public List<Playlist> getPlaylist(int id) {
        List<Playlist> playlists = playlistMapper.getPlaylistById(id);
        for (Playlist playlist : playlists){
            playlist.setSongs(songService.getSongsByPlaylistId(playlist.getPlaylistId()));
            playlist.setSongCount(playlist.getSongs().size());
            playlist.setUserName(userMapper.getUserById(id));
            if (!playlist.getSongs().isEmpty()) {
                playlist.setCover(playlist.getSongs().get(0).getCover());
            }
        }
        return playlists;
    }

    @Override
    public void addSongById(int id, int songId) {
        playlistMapper.addSongById(id, songId);
    }
}
