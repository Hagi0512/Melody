package com.it.melody.service.impl;

import com.it.melody.mapper.PlaylistMapper;
import com.it.melody.mapper.SongMapper;
import com.it.melody.mapper.UserMapper;
import com.it.melody.pojo.Playlist;
import com.it.melody.service.PlaylistService;
import com.it.melody.service.SongService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlaylistServiceImpl implements PlaylistService {

    @Autowired
    PlaylistMapper playlistMapper;
    @Autowired
    SongService songService;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private SongMapper songMapper;

    @Override
    public List<Playlist> getPlaylist(int id) {
        List<Playlist> playlists = playlistMapper.getPlaylistById(id);
        for (Playlist playlist : playlists){
            setPlaylistInfo(playlist);
        }
        return playlists;
    }

    @Override
    public void addSongById(int id, int songId) {
        playlistMapper.addSongById(id, songId);
    }

    @Override
    public void deleteSong(List<Integer> songIds) {
        songMapper.deleteSongsById(songIds);
    }

    @Override
    public void createPlaylist(Integer id, String name, String description) {
        playlistMapper.addPlaylistByUserId(id, name, description);
    }

    @Override
    public void updatePlaylist(int id, String name, String description) {
        playlistMapper.updatePlaylistById(id, name, description);
    }

    @Override
    public Playlist getPlaylistById(int id) {
        return setPlaylistInfo(playlistMapper.getPlaylistByListId(id));
    }

    public Playlist setPlaylistInfo(Playlist playlist) {
        playlist.setSongs(songService.getSongsByPlaylistId(playlist.getPlaylistId()));
        playlist.setSongCount(playlist.getSongs().size());
        playlist.setUserName(userMapper.getUserById(playlist.getUserId()));
        if (!playlist.getSongs().isEmpty()) {
            playlist.setCover(playlist.getSongs().get(0).getCover());
        }
        return playlist;
    }
}
