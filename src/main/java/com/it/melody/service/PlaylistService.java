package com.it.melody.service;

import com.it.melody.pojo.Playlist;

import java.util.List;

public interface PlaylistService {
    List<Playlist> getPlaylist(int id);

    void addSongById(int id, int songId);

    void deleteSong(List<Integer> songIds);

    void createPlaylist(Integer id, String name, String description);

    void updatePlaylist(int id, String name, String description);

    Playlist getPlaylistById(int id);

    void deletePlaylist(int id);
}
